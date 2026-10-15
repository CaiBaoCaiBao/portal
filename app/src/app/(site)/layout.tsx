interface Props extends LayoutProps<"/"> {
}

export default function Layout({ children }: Props) {
    return (
        <div>
            {children}
        </div>
    )
}